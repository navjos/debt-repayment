'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2 } from 'lucide-react'
import { Karla } from 'next/font/google'

const karla = Karla({ subsets: ['latin'] })

const glowCell = "relative after:absolute after:inset-0 after:rounded-md after:shadow-[0_0_10px_rgba(185,51,173,0.3)] after:animate-pulse"

interface Debt {
  creditor: string
  balance: number
  apr: number
  minimumPayment: number
}

interface DebtWithPayoff extends Debt {
  monthlyPayment: number
  monthsToPayoff: number
}

export default function DebtRepaymentCalculator() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [newDebt, setNewDebt] = useState<Debt>({ creditor: '', balance: 0, apr: 0, minimumPayment: 0 })
  const [repaymentMethod, setRepaymentMethod] = useState<'avalanche' | 'snowball'>('avalanche')
  const [extraPayment, setExtraPayment] = useState<number>(0)
  const [repaymentPlan, setRepaymentPlan] = useState<DebtWithPayoff[]>([])

  const addDebt = () => {
    if (newDebt.creditor && newDebt.balance > 0 && newDebt.apr >= 0 && newDebt.minimumPayment > 0) {
      setDebts([...debts, newDebt])
      setNewDebt({ creditor: '', balance: 0, apr: 0, minimumPayment: 0 })
    }
  }

  const removeDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index))
  }

  const calculateRepayment = () => {
    let sortedDebts = [...debts]
    if (repaymentMethod === 'avalanche') {
      sortedDebts.sort((a, b) => b.apr - a.apr)
    } else {
      sortedDebts.sort((a, b) => a.balance - b.balance)
    }

    let remainingExtra = extraPayment
    const plan: DebtWithPayoff[] = sortedDebts.map((debt, index) => {
      const monthlyPayment = index === 0 ? debt.minimumPayment + remainingExtra : debt.minimumPayment
      const monthsToPayoff = calculateMonthsToPayoff(debt.balance, debt.apr / 100 / 12, monthlyPayment)
      remainingExtra = index === 0 ? 0 : remainingExtra
      return { ...debt, monthlyPayment, monthsToPayoff }
    })

    setRepaymentPlan(plan)
  }

  const calculateMonthsToPayoff = (balance: number, monthlyInterestRate: number, payment: number): number => {
    return Math.log(1 + (balance / payment) * (1 - (1 + monthlyInterestRate))) / Math.log(1 + monthlyInterestRate)
  }

  const highestAPRDebt = debts.reduce((max, debt) => debt.apr > max.apr ? debt : max, debts[0] || { apr: 0, minimumPayment: 0 })

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const averageAPR = debts.length > 0 ? debts.reduce((sum, debt) => sum + debt.apr, 0) / debts.length : 0
  const totalMinPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0)

  return (
    <Card className={`w-full max-w-4xl mx-auto ${karla.className}`}>
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/w07-removebg-preview-Sk6IFfCZMW24hLjPKSoQrwVFj6wxsB.png"
            alt="WealthOnThe7 Logo"
            className="h-12 object-contain"
          />
        </div>
        <CardTitle>Debt Repayment Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Add Your Debts</h3>
          <div className="grid grid-cols-5 gap-4">
            <Input
              placeholder="Creditor"
              value={newDebt.creditor}
              onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Balance"
              value={newDebt.balance || ''}
              onChange={(e) => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="APR %"
              value={newDebt.apr || ''}
              onChange={(e) => setNewDebt({ ...newDebt, apr: parseFloat(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="Min Payment"
              value={newDebt.minimumPayment || ''}
              onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: parseFloat(e.target.value) || 0 })}
            />
            <Button onClick={addDebt} className="w-full bg-[#B933AD] hover:bg-[#B933AD]/90">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {debts.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creditor</TableHead>
                <TableHead>Balance ($)</TableHead>
                <TableHead>APR %</TableHead>
                <TableHead>Minimum Payment</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt, index) => (
                <TableRow key={index}>
                  <TableCell>{debt.creditor}</TableCell>
                  <TableCell>{debt.balance.toFixed(2)}</TableCell>
                  <TableCell>{debt.apr.toFixed(2)}%</TableCell>
                  <TableCell>{debt.minimumPayment.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeDebt(index)} className="bg-[#B933AD] hover:bg-[#B933AD]/90 text-white">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Repayment Method</h3>
          <RadioGroup
            defaultValue="avalanche"
            onValueChange={(value) => setRepaymentMethod(value as 'avalanche' | 'snowball')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="avalanche" id="avalanche" />
              <Label htmlFor="avalanche">Debt Avalanche</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="snowball" id="snowball" />
              <Label htmlFor="snowball">Debt Snowball</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Extra Payment</h3>
          <Input
            type="number"
            placeholder="Extra monthly payment"
            value={extraPayment || ''}
            onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
          />
        </div>

        <Button onClick={calculateRepayment} className="bg-[#B933AD] hover:bg-[#B933AD]/90">Calculate Repayment Plan</Button>

        {repaymentPlan.length > 0 && (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Summary Statistics</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Highest APR</TableCell>
                    <TableCell>{highestAPRDebt.apr.toFixed(2)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Card with Highest APR</TableCell>
                    <TableCell>{highestAPRDebt.creditor}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Min. Payment of Card with Highest APR</TableCell>
                    <TableCell>${highestAPRDebt.minimumPayment.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Your Extra Payment</TableCell>
                    <TableCell>${extraPayment.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Repayment Plan</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creditor</TableHead>
                    <TableHead>Balance ($)</TableHead>
                    <TableHead>APR %</TableHead>
                    <TableHead>Minimum Payment</TableHead>
                    <TableHead>Monthly Payment</TableHead>
                    <TableHead>Months to payoff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repaymentPlan.map((debt, index) => (
                    <TableRow key={index}>
                      <TableCell>{debt.creditor}</TableCell>
                      <TableCell>{debt.balance.toFixed(2)}</TableCell>
                      <TableCell>{debt.apr.toFixed(2)}%</TableCell>
                      <TableCell>{debt.minimumPayment.toFixed(2)}</TableCell>
                      <TableCell className={`font-semibold ${glowCell}`}>{debt.monthlyPayment.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">{debt.monthsToPayoff.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">TOTAL DEBT</TableCell>
                    <TableCell className="font-semibold">{totalDebt.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">{averageAPR.toFixed(2)}%</TableCell>
                    <TableCell className="font-semibold">{totalMinPayment.toFixed(2)}</TableCell>
                    <TableCell className={`font-semibold ${glowCell}`}>
                      {(totalMinPayment + extraPayment).toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {(repaymentPlan.reduce((max, debt) => Math.max(max, debt.monthsToPayoff), 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
